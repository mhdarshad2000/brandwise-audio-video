const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/rockfordfosgate/rockfordfosgate-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const rockford = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    rockford[i] = {}
                    rockford[i]['state'] = ($(state).children("strong").text())
                    rockford[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        rockford[i]['states'][j] = {}
                        rockford[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        rockford[i]['states'][j]['link'] = link

                        rockford[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(rockford)
                    fs.writeFileSync("./rockford/rockford.json", brand)
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

            $(postDiv).find(" div > ul > li").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("h5").text()
                arr[i]["address"] = $(serviceCenter).children("p").text()?.split("Phone:")[0]?.replaceAll("     "," ")?.replaceAll("\n","")?.replaceAll("\t","")?.trim()
                arr[i]["phone"] = $(serviceCenter).children("p").text()?.split("Phone:")[1]?.trim()
            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}