const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/toshiba/toshiba-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const toshiba = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                toshiba[i] = {}
                toshiba[i]['state'] = ($(state).children("strong").text())
                toshiba[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    toshiba[i]['states'][j] = {}
                    toshiba[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    toshiba[i]['states'][j]['link'] = link

                    toshiba[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(toshiba)
                fs.writeFileSync("./toshiba/toshiba.json", brand)

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

            $(postDiv).find("table > tbody > tr").each((i,serviceCenter)=>{
                arr[i-1]= {}
                arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().text().trim()
                arr[i-1]["address"] = $(serviceCenter).children("td:nth-child(2)").text().replace(/(\r\n|\n|\r|\t)/gm, "").trim()
                arr[i-1]["phone"] = $(serviceCenter).children("td").last().text().replace(/(\r\n|\n|\r|\t|P:)/gm, "")?.split("T:")[0]?.split("F:")[0]?.trim()
                arr[i-1]["fax"] = $(serviceCenter).children("td").last().text().replace(/(\r\n|\n|\r|\t|P:)/gm, "")?.split("F:")[1]?.trim()
            })
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}