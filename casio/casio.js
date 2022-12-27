const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/casio/casio-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const casio = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    casio[i] = {}
                    casio[i]['state'] = ($(state).children("strong").text())
                    casio[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        casio[i]['states'][j] = {}
                        casio[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        casio[i]['states'][j]['link'] = link

                        casio[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(casio)
                    fs.writeFileSync("./casio/casio.json", brand)
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
                !$(serviceCenter).children("strong").text().includes("Casio Customer Service Representative")&&
                !$(serviceCenter).children("strong").text().includes("Casio Support Products:")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code") ){
                    arr[count] = {}
                    const serviceCenterName= $(serviceCenter).children("strong").text()
                    arr[count]["serviceCenter"] =serviceCenterName .replaceAll("\n","").trim()

                    const address = $(serviceCenter).text().replace(serviceCenterName,"")
                    arr[count]["address"] = address?.split(" Phone:")[0].replaceAll("\n","  ").replaceAll("\t","").trim()
                    arr[count]["phone"] = address?.split(" Phone:")[1]?.split("\n")[0]?.trim()
                    arr[count]["fax"] = address?.split(" Fax:")[1]?.split("\n")[0]?.trim()

                    count ++
                }
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}