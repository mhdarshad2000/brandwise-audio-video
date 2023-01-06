const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/tamron/tamron-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const tamron = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(12),div:nth-child(13)").children("ul").map((i, state) => {
                tamron[i] = {}
                tamron[i]['state'] = ($(state).children("strong").text())
                tamron[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    tamron[i]['states'][j] = {}
                    tamron[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    tamron[i]['states'][j]['link'] = link

                    tamron[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(tamron)
                fs.writeFileSync("./tamron/tamron.json", brand)

            }, 20000)

        } catch (error) {
            console.log(error.message)
        }
    })
}

scrap()

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")

           $(postDiv).children("div:not(.advlaterale)").each((i,serviceCenter)=>{
            arr[i]={}
            arr[i]["serviceCenter"] = $(serviceCenter).children("strong").text()
            arr[i]["address"] = $(serviceCenter).text().split("|")[1]
            const phone = $(serviceCenter).text().split("Map It")[1]?.split("|")[0]
            arr[i]["phone"] = !/[a-z]/gi.test(phone) ? phone?.replace(/(\r\n|\n|\r|\t)/gm, " ").trim() : ""
           })

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}