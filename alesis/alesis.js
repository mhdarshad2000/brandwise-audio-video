const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/alesis/alesis-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const alesis = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    alesis[i] = {}
                    alesis[i]['state'] = ($(state).children("strong").text())
                    alesis[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        alesis[i]['states'][j] = {}
                        alesis[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        alesis[i]['states'][j]['link'] = link

                        alesis[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(alesis)
                    fs.writeFileSync("./alesis/alesis.json", brand)
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

            $(postDiv).children("strong").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).text().trim()
                const address = $(serviceCenter).next().text()
                arr[i]["address"]= address?.split("Tel:")[0].replaceAll("\t","").replaceAll("\n"," ")?.trim()
                arr[i]["phone"] = address?.split("Tel:")[1]?.split("\n")[0]?.trim()
                arr[i]["fax"] = address?.split("Fax:")[1]?.split("\n")[0]?.trim()
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}