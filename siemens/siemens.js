const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/siemens/siemens-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const siemens = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                siemens[i] = {}
                siemens[i]['state'] = ($(state).children("strong").text())
                siemens[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    siemens[i]['states'][j] = {}
                    siemens[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    siemens[i]['states'][j]['link'] = link

                    siemens[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(siemens)
                fs.writeFileSync("./siemens/siemens.json", brand)

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

            let count = 0
            $(postDiv).children("p").each((i, p) => {
                if ($(p).children("strong").length === 1 &&
                 !$(p).text().includes("Siemens Customer Service Representative") &&
                 !$(p).text().includes("Siemens Support Products:") &&
                 !$(p).text().includes("Zip Code:")) {
                    
                    arr[count]={}
                    const header = $(p).children("strong").text()
                    arr[count]["serviceCenter"] = header 
                    arr[count]["address"] = $(p).text().replace(header,"").split("Phone:")[0].replaceAll("\n","").replaceAll("\t","").trim()
                    arr[count]["phone"] = $(p).text()?.split("Phone:")[1]?.split("Fax:")[0]?.replaceAll("\n","")?.replaceAll("\t","")?.trim()
                    arr[count]["fax"] = $(p).text()?.split("Fax:")[1]?.replaceAll("\n","")?.replaceAll("\t","")?.trim()
                    count++
                }
            })

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}