const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/leica/leica-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const leica = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    leica[i] = {}
                    leica[i]['state'] = ($(state).children("strong").text())
                    leica[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        leica[i]['states'][j] = {}
                        leica[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        leica[i]['states'][j]['link'] = link

                        leica[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(leica)
                    fs.writeFileSync("./leica/leica.json", brand)
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

            $(postDiv).children(" div > div > div > div > div:nth-child(2)").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).text()
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}