const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/samsung/samsung-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const samsung = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                samsung[i] = {}
                samsung[i]['state'] = ($(state).children("strong").text())
                samsung[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        samsung[i]['states'][j] = {}
                        samsung[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        samsung[i]['states'][j]['link'] = link
                        samsung[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            samsung[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(samsung)
                fs.writeFileSync("./samsung/samsung.json", brand)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/samsung")
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

            const table = $(postDiv).find(" table > tbody > tr")
            if (table) {
                $(table).each((i, serviceCenter) => {
                    if (i !== 0) {
                        arr[i - 1] = {}
                        arr[i - 1]["serviceCenter"] = $(serviceCenter).children().first().text().replaceAll("\n", "").replaceAll("\t", "").trim()
                        const address = $(serviceCenter).children("td:nth-child(2)").text()
                        // arr[i-1]["address"]= address
                        if (/[a-z]/gi.test(address)) {
                            if (address.includes("(")) {
                                arr[i - 1]["address"] = address.split("(")[0].replaceAll("\t", "").replaceAll("    ", "").replaceAll("\n", " ").trim()
                                arr[i - 1]["phone"] = "(" + address.split("(")[1].trim()
                            } else {
                                const temp = []
                                const string = address.split("\n")
                                string.map((elem, index) => {
                                    if (!/[a-z]/gi.test(elem)) {
                                        temp.push(elem)
                                        string[index] = ""
                                    }
                                    arr[i - 1]["address"] = string.join().replaceAll("\t", "").replaceAll("    ", "").replaceAll("\n", " ").trim()
                                    arr[i - 1]["phone"] = temp.join().trim()
                                })
                            }
                        } else {
                            arr[i - 1]["phone"] = address
                        }
                        if (arr[i - 1]["phone"] === "") {
                            const last = $(serviceCenter).children("td").last().text()
                            if (!/[a-z]/gi.test(last))
                                arr[i - 1]["phone"] = last.trim()
                        }
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}