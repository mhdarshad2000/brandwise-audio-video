const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/konica-minolta/konica-minolta-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const konicaMinolta = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    konicaMinolta[i] = {}
                    konicaMinolta[i]['state'] = ($(state).children("strong").text())
                    konicaMinolta[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        konicaMinolta[i]['states'][j] = {}
                        konicaMinolta[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        konicaMinolta[i]['states'][j]['link'] = link

                        konicaMinolta[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(konicaMinolta)
                    fs.writeFileSync("./konicaMinolta/konicaMinolta.json", brand)
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
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("td").first().text().trim()
                    arr[i]["address"] = $(serviceCenter).children("td:nth-child(2)").text().split("Phone:")[0].replaceAll("\t", "").replaceAll("\n", "").replaceAll("       ", " ").trim()
                    arr[i]["phone"] = $(serviceCenter).children("td:nth-child(2)").text().split("Phone:")[1]?.split("Fax:")[0]?.split("\n")[0]?.trim()
                    arr[i]["fax"] = $(serviceCenter).children("td:nth-child(2)").text()?.split("Fax:")[1]?.split("\n")[0]?.trim()
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}