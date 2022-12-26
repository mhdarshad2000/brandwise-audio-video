const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/alpine/alpine-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const alpine = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    alpine[i] = {}
                    alpine[i]['state'] = ($(state).children("strong").text())
                    alpine[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        alpine[i]['states'][j] = {}
                        alpine[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        alpine[i]['states'][j]['link'] = link

                        alpine[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(alpine)
                    fs.writeFileSync("./alpine/alpine.json", brand)
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

            $(postDiv).children("p.elenchi").each((i, serviceCenter) => {
                arr[i] = {}
                arr[i]["serviceCenter"] = $(serviceCenter).children("span").children("strong").text().trim()
                arr[i]["address"] = $(serviceCenter).children("span").children("span.evidenziato").text().trim()
                arr[i]["phone"] = $(serviceCenter).children("span:nth-child(5)").text()?.replace("or",",")?.split("Ext.")[0]?.split("Fax:")[0].trim()
                const fax = $(serviceCenter).children("span:nth-child(5)").text().split("Fax:")[1]?.trim()
                arr[i]["fax"] = fax ? fax : $(serviceCenter).children("span:nth-child(7)").text()?.trim()

            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}