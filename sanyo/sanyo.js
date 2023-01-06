const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/sanyo/sanyo-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const sanyo = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    sanyo[i] = {}
                    sanyo[i]['state'] = ($(state).children("strong").text())
                    sanyo[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        sanyo[i]['states'][j] = {}
                        sanyo[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        sanyo[i]['states'][j]['link'] = link

                        sanyo[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(sanyo)
                    fs.writeFileSync("./sanyo/sanyo.json", brand)
                }, 20000)
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

            $(postDiv).children("div:not(.advlaterale)").children("h4").each((i, serviceCenter) => {
                arr[i] = {}
                const serviceCenterName = $(serviceCenter).text()
                arr[i]["serviceCenter"] = serviceCenterName
                const address = $(serviceCenter).parent().text().replace(serviceCenterName, "").replace(/(\r\n|\n|\r|\t)/gm, "").replaceAll("          ", " ")
                arr[i]["address"] = address.split("Tel:")[0].trim()
                arr[i]["phone"] = address.split("Tel:")[1].trim()
            })
            if (!arr.length) {
                let count = 0
                $(postDiv).children("p.elenchi").each((i, serviceCenter) => {
                    if ($(serviceCenter).children("strong").length === 1) {
                        arr[count] = {}
                        const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                        arr[count]["serviceCenter"] = serviceCenterName 
                        const address = $(serviceCenter).children("span").text().trim()
                        arr[count]["address"] = address
                        arr[count]["phone"] = $(serviceCenter).text()?.split("Phone:")[1]?.split("Map")[0]?.replace(/(\r\n|\n|\r|\t)/gm, "")?.trim()
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