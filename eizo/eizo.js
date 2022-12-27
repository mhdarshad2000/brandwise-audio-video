const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/eizo.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const eizo = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    eizo[i] = {}
                    eizo[i]['state'] = ($(state).children("strong").text())
                    eizo[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        eizo[i]['states'][j] = {}
                        eizo[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        eizo[i]['states'][j]['link'] = link

                        eizo[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(eizo)
                    fs.writeFileSync("./eizo/eizo.json", brand)
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

            const tableDiv = $(postDiv).find("table > tbody > tr")

            if ($(tableDiv).text()) {
                $(tableDiv).each((i, serviceCenter) => {
                        arr[i] = {}
                        const serviceCenterName = $(serviceCenter).children("td").children("h2")
                        arr[i]["serviceCenter"] = serviceCenterName.text().replaceAll("\n","").replaceAll("\t").trim()
                        if(/[a-z]/gi.test($(serviceCenterName).next().text())){
                            arr[i]["address"] =$(serviceCenterName).next().text().replaceAll("\t","").replaceAll("  ","").replaceAll("\n"," ").trim()
                            arr[i]["phone"] =$(serviceCenterName).next()?.next()?.text().trim()
                        }else{
                            arr[i]["phone"] =$(serviceCenterName).next().text().trim()
                        }
                        
                })
            }


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}