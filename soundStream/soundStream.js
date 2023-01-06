const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/soundstream/soundstream-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const soundStream = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(12),div:nth-child(13)").children("ul").map((i, state) => {
                soundStream[i] = {}
                soundStream[i]['state'] = ($(state).children("strong").text())
                soundStream[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    soundStream[i]['states'][j] = {}
                    soundStream[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    soundStream[i]['states'][j]['link'] = link

                    soundStream[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(soundStream)
                fs.writeFileSync("./soundStream/soundStream.json", brand)

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

           $(postDiv).find(" table > tbody > tr > td:nth-child(1)").each((i,serviceCenter)=>{
            arr[i]={}
            const serviceCenterName = $(serviceCenter).find("strong").text()
            arr[i]["serviceCenter"] = serviceCenterName
            arr[i]["address"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("Phone:")[0]?.replace(/(\r\n|\n|\r|\t)/gm, " ")?.trim()
            arr[i]["phone"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("Phone:")[1]?.split("\n")[0]?.trim()
           })

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}