const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/sharp/sharp-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const sharp = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                sharp[i] = {}
                sharp[i]['state'] = ($(state).children("strong").text())
                sharp[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        sharp[i]['states'][j] = {}
                        sharp[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        sharp[i]['states'][j]['link'] = link
                        sharp[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            sharp[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(sharp)
                fs.writeFileSync("./sharp/sharp.json", brand)
            }, 20000)

        } catch (error) {
            console.log(error)
        }
    })
}

scrap()


async function nextPage(url) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            let promises = []
            const htmlString = await rp(url)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            await $(div).children("ul").children("li").each(async (i, city) => {
                arr[i] = {}
                arr[i]["name"] = $(city).text()
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/sharp")
                arr[i]["link"] = link
                promises.push({ i, link })
            })
            Promise.all(promises.map(async (i) => {
                arr[i.i]["city"] = await otherCity(i.link)
            })).then(() => {
                resolve(arr)
            })
        } catch (error) {
        }
    })
}

async function otherCity(otherUrl) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(otherUrl)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            $(div).find("div[ itemscope='itemscope']").each((i, serviceCenter) => {
                arr[i] = {}
                arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text().replaceAll("\n", "").replaceAll("\t", "").trim()
                arr[i]["address"] = $(serviceCenter).children("div").children("div").children("p").text()
                arr[i]["phone"] = $(serviceCenter).children("div").children("div").children("div [itemprop='telephone']").text()

            })
            resolve(arr)
        } catch (error) {

        }
    })
}

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")

            let count = 0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length=== 1 &&
                ! $(serviceCenter).children("strong").text().includes("Support for Sharp products") &&
                ! $(serviceCenter).children("strong").text().includes("Sharp Support Products:") &&
                ! $(serviceCenter).children("strong").text().includes("Zip Code") ){
                    arr[count]={}
                    const serviceCenterName = $(serviceCenter).children("strong").text()
                    arr[count]["serviceCenter"] = serviceCenterName
                    const address = $(serviceCenter).text().replace(serviceCenterName,"")
                    arr[count]["address"] = address?.split("Phone:")[0]?.trim().replace(/(\r\n|\n|\r|\t)/gm, "  ").replace("        "," ").trim()
                    arr[count]["phone"] = address?.split("Phone:")[1]?.trim()
                    count ++
                }
            })

            if(!arr.length){
                $(postDiv).find("div > div > div > div > h3 ").each((i,serviceCenter)=>{
                    arr[i]={}
                    arr[i]["serviceCenter"] = $(serviceCenter).text()
                    arr[i]["address"] = $(serviceCenter).next().find("p").text()
                    arr[i]["phone"] = $(serviceCenter).next().find("div[itemprop='telephone']").text()
                })
            }

            resolve(arr)
        } catch (error) {
            console.error(error.message)
        }
    })
}