const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/monster/monster-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const monster = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    monster[i] = {}
                    monster[i]['state'] = ($(state).children("strong").text())
                    monster[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        monster[i]['states'][j] = {}
                        monster[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        monster[i]['states'][j]['link'] = link

                        monster[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(monster)
                    fs.writeFileSync("./monster/monster.json", brand)
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

            if ($(tableDiv).text()) {
                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0 && $(serviceCenter).children("td").text().trim().length){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().text().trim()
                        arr[i-1]["address"] = $(serviceCenter).children("td:nth-child(2)").text().replaceAll("\n    ","").replaceAll('\"',"'").trim()
                        arr[i-1]["phone"] = $(serviceCenter).children("td:nth-child(3)").text().trim()
                    }
                })
            } else {
                console.log(1)
            //     $(postDiv).children("h2").each((i, serviceCenter) => {
            //         if (!$(serviceCenter).text().includes("Hitachi Service Centers in")) {
            //             arr[i - 1] = {}
            //             arr[i - 1]["serviceCenter"] = $(serviceCenter).text().trim()
            //             if (/[a-z]/gi.test($(serviceCenter).next().text())) {
            //                 arr[i - 1]["address"] = $(serviceCenter).next().text().replaceAll("\t","").replaceAll("\n"," ").trim()
            //                 arr[i - 1]["phone"] = $(serviceCenter).next().next().text().trim()
            //             } else {
            //                 arr[i - 1]["phone"] = $(serviceCenter).next().text().trim()
            //             }
            //         }
            //     })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}