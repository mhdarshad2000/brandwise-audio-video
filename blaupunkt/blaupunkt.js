const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/blaupunkt/blaupunkt-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const blaupunkt = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    blaupunkt[i] = {}
                    blaupunkt[i]['state'] = ($(state).children("strong").text())
                    blaupunkt[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        blaupunkt[i]['states'][j] = {}
                        blaupunkt[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        blaupunkt[i]['states'][j]['link'] = link

                        blaupunkt[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(blaupunkt)
                    fs.writeFileSync("./blaupunkt/blaupunkt.json", brand)
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

            $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                if ($(serviceCenter).children("h2").length) {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text().trim()
                    if (/[a-z]/gi.test($(serviceCenter).children("div").first().text())) {
                        arr[i]["address"] = $(serviceCenter).children("div").first().text().replaceAll("\n", "").replaceAll("\t", "").trim()
                        arr[i]["phone"] = $(serviceCenter).children("div:nth-child(3)").text()?.replace("Unavailable", "")?.trim()
                    } else {
                        arr[i]["phone"] = $(serviceCenter).children("div").first().text()?.replace("Unavailable", "").trim()
                    }
                }
            })

            if (!arr.length) {
                if ($(tableDiv).text()) {
                    $(tableDiv).each((i, serviceCenter) => {
                        arr[i] = {}
                        arr[i]["serviceCenter"] = $(serviceCenter).children("td").children("h2").text()
                        if (/[a-z]/gi.test($(serviceCenter).children("td").children("div").first().text())) {
                            arr[i]["address"] = $(serviceCenter).children("td").children("div").first().text().replaceAll("\t", "").replaceAll(" ", "").replaceAll("\n", " ").trim()
                            arr[i]["phone"] = $(serviceCenter).children("td").children("div:nth-child(3)").text().trim()
                        } else {
                            arr[i]["phone"] = $(serviceCenter).children("td").children("div:nth-child(2)").text().trim()
                        }
                    })
                } else {
                    $(postDiv).children("h2").each((i,serviceCenter)=>{
                        if(!$(serviceCenter).text().includes("Blaupunkt Service Centers in")){
                            arr[i-1]={}
                            arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                            arr[i-1]["address"] = $(serviceCenter).next().text().replaceAll("\t","").replaceAll("\n"," ").trim()
                            arr[i-1]["phone"] = $(serviceCenter).next().next().text()
                        }

                    })
                }
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}