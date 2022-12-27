const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/gibson/gibson-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const gibson = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    gibson[i] = {}
                    gibson[i]['state'] = ($(state).children("strong").text())
                    gibson[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        gibson[i]['states'][j] = {}
                        gibson[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        gibson[i]['states'][j]['link'] = link

                        gibson[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(gibson)
                    fs.writeFileSync("./gibson/gibson.json", brand)
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

            $(postDiv).find(" div > strong").each((i,serviceCenter)=>{
                arr[i]={}
                const serviceCenterName =$(serviceCenter).text()
                arr[i]["serviceCenter"]= serviceCenterName

                const address = $(serviceCenter).parent().text().replace(serviceCenterName,"")
                arr[i]["adress"] = address.split("Phone:")[0].replaceAll("\t","").replaceAll("  ","").replaceAll("\n"," ").trim()
                arr[i]["phone"] = address.split("Phone:")[1].split("\n")[0].trim()

            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}