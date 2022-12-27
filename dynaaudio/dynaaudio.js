const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/dynaudio/dynaudio-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const dynaaudio = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    dynaaudio[i] = {}
                    dynaaudio[i]['state'] = ($(state).children("strong").text())
                    dynaaudio[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        dynaaudio[i]['states'][j] = {}
                        dynaaudio[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        dynaaudio[i]['states'][j]['link'] = link

                        dynaaudio[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(dynaaudio)
                    fs.writeFileSync("./dynaaudio/dynaaudio.json", brand)
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
                let count = 0
                $(tableDiv).each((i, serviceCenter) => {
                    if (!$(serviceCenter).text().includes("Dynaudio ranges")) {
                        arr[count] = {}
                        const serviceCenterName = $(serviceCenter).children("td").children("strong")
                        arr[count]["serviceCenter"] = serviceCenterName.text().replaceAll("\n","").replaceAll("\t").trim()
                        arr[count]["address"] = $(serviceCenterName).parent().text().replace($(serviceCenterName).text(),"").replaceAll("\t","")?.split("Phone:")[0].replaceAll("   ","").replaceAll("\n"," ").trim()
                        arr[count]["phone"] = $(serviceCenterName).parent().text()?.split("Phone:")[1]?.split("\n")[0]?.trim()

                        count++
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}