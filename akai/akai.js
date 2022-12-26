const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/akai/akai-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const akai = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    akai[i] = {}
                    akai[i]['state'] = ($(state).children("strong").text())
                    akai[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        akai[i]['states'][j] = {}
                        akai[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        akai[i]['states'][j]['link'] = link

                        akai[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(akai)
                    fs.writeFileSync("./akai/akai.json", brand)
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

            let count =0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length === 1&&
                !$(serviceCenter).children("strong").text().includes("Support for Akai products")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code") ){
                    arr[count] = {}
                    arr[count]["serviceCenter"] = $(serviceCenter).children("strong").text()
                    const address = $(serviceCenter).next().text()
                    arr[count]["address"] = address?.split("Tel:")[0].replaceAll("\t","").replaceAll("\n"," ").trim()
                    arr[count]["phone"] = address?.split("Tel:")[1]?.split("\n")[0]?.trim()
                    arr[count]["fax"] = address?.split("Fax:")[1]?.split("\n")[0]?.trim()

                    count ++
                }
            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}