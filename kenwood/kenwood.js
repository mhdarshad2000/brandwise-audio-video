const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/kenwood/kenwood-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const kenwood = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    kenwood[i] = {}
                    kenwood[i]['state'] = ($(state).children("strong").text())
                    kenwood[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        kenwood[i]['states'][j] = {}
                        kenwood[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        kenwood[i]['states'][j]['link'] = link

                        kenwood[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(kenwood)
                    fs.writeFileSync("./kenwood/kenwood.json", brand)
                }, 8000)
            })

        } catch (error) {
            console.log(error.message, 404)
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

            const tableDiv = $(postDiv).find(" table > tbody > tr")

            if ($(tableDiv).text()) {
                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().text().trim()
                        arr[i-1]["address"] = $(serviceCenter).children("td:nth-child(2)").text().replaceAll("\t","").replaceAll("\n","").replaceAll("          "," ").trim()
                        arr[i-1]["phone"] = $(serviceCenter)?.children("td:nth-child(3)")?.text()?.trim()
                    }
                })
            } 

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}