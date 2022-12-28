const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/olympus/olympus-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const olympus = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    olympus[i] = {}
                    olympus[i]['state'] = ($(state).children("strong").text())
                    olympus[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        olympus[i]['states'][j] = {}
                        olympus[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        olympus[i]['states'][j]['link'] = link

                        olympus[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(olympus)
                    fs.writeFileSync("./olympus/olympus.json", brand)
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
            
            $(postDiv).find(" ul > li").each((i,serviceCenter)=>{
                arr[i]={}
                const serviceCenterName = $(serviceCenter).text().split("\n")[0]?.trim()
                arr[i]["serviceCenter"] = serviceCenterName
                arr[i]["address"] = $(serviceCenter).text().replace(serviceCenterName,"").replaceAll("\t","").replaceAll("\n","").trim()
            })
           

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}