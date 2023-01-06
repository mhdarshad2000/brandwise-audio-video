const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/rca/rca-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const rca = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    rca[i] = {}
                    rca[i]['state'] = ($(state).children("strong").text())
                    rca[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        rca[i]['states'][j] = {}
                        rca[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        rca[i]['states'][j]['link'] = link

                        rca[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(rca)
                    fs.writeFileSync("./rca/rca.json", brand)
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

            const tableDiv = $(postDiv).find("table > tbody > tr > td > h2")

            if ($(tableDiv).text()) {
                $(tableDiv).each((i,serviceCenter)=>{
                   arr[i]={}
                   arr[i]["serviceCenter"] = $(serviceCenter).text()
                   const address = $(serviceCenter).next()
                   if(/[a-z]/gi.test(address.text())){
                    arr[i]["address"] = address.text().replaceAll("\n","").replaceAll("\t","").replaceAll("         "," ").trim()
                    arr[i]["phone"] = address.next().text().trim()
                   }else{
                    arr[i]["phone"] = address.text().trim()
                   }
                })
            } else {
                $(postDiv).children("h2").each((i, serviceCenter) => {
                    if (!$(serviceCenter).text().includes("Rca Service Centers in")) {
                        arr[i - 1] = {}
                        arr[i - 1]["serviceCenter"] = $(serviceCenter).text().trim()
                        const address = $(serviceCenter).next()
                        if (/[a-z]/gi.test(address.text())) {
                            arr[i - 1]["address"] = address.text().replaceAll("\n","").replaceAll("\t").trim()
                            arr[i - 1]["phone"] = address.next().text().trim()
                        } else {
                            arr[i - 1]["phone"] = address.text().trim()
                        }
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}