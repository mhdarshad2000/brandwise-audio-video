const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/nikon/nikon-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const nikon = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                nikon[i] = {}
                nikon[i]['state'] = ($(state).children("strong").text())
                nikon[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        nikon[i]['states'][j] = {}
                        nikon[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        nikon[i]['states'][j]['link'] = link
                        nikon[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            nikon[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(nikon)
                fs.writeFileSync("./nikon/nikon.json", brand)
            }, 7000)

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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/nikon")
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

            const itemScope = $(div).find("div[ itemscope='itemscope']")
            if (itemScope.text()) {
                $(itemScope).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text().replaceAll("\n", "").replaceAll("\t", "").trim()
                    arr[i]["address"] = $(serviceCenter).children("div").children("div").children("p").text()
                    arr[i]["phone"] = $(serviceCenter).children("div").children("div").children("div [itemprop='telephone']").text()
                })
            } else {
                let count = 0
                $(div).children("p").each((i, serviceCenter) => {
                    if ($(serviceCenter).children("strong").length === 1 &&
                        !$(serviceCenter).children("strong").text().includes("Nikon Support Products:") &&
                        !$(serviceCenter).children("strong").text().includes("Support for Nikon products") &&
                        !$(serviceCenter).children("strong").text().includes("Zip Code:")) {
                        arr[count] = {}
                        const serviceCenterName = $(serviceCenter).children("strong")
                        arr[count]["serviceCenter"] = serviceCenterName.text().trim()
                        const address = $(serviceCenterName)?.parent().text().replace($(serviceCenterName).text(), "")
                        arr[count]["address"] = address?.split("Phone:")[0]?.replaceAll("\n", "")?.replaceAll("\t", "")?.trim()
                        arr[count]["phone"] = address?.split("Phone:")[1]?.split("\n")[0]?.replaceAll("\n", "")?.replaceAll("\t", "")?.trim()
                        arr[count]["fax"] = address?.split("Fax")[1]?.split("\n")[0]?.replaceAll("\n", "")?.replaceAll("\t", "")?.trim()
                        count++
                    }
                })
            }

                if(!arr.length){
                    $(div).children("h3:not(.fumna)").each((i,serviceCenter)=>{
                        arr[i]={}
                        arr[i]["serviceCenter"] = $(serviceCenter)?.text()
                        arr[i]["address"] = $(serviceCenter).next()?.children()?.children("p")?.text()
                        arr[i]["phone"] = $(serviceCenter)?.next()?.children()?.children("div")?.text()
                    })

            }


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
            $(postDiv).children("p").each((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length === 1 &&
                    !$(serviceCenter).children("strong").text().includes("Nikon Support Products:") &&
                    !$(serviceCenter).children("strong").text().includes("Support for Nikon products") &&
                    !$(serviceCenter).children("strong").text().includes("Zip Code:") &&
                    $(serviceCenter).children("strong").text().trim().length) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    const address = $(serviceCenter).text().replace(serviceCenterName, "")
                    arr[count]["address"] = address?.split("Phone:")[0].replaceAll("\n", "").replaceAll("\t", "")?.trim()
                    arr[count]["phone"] = address.split("Phone:")[1]?.split("\n")[0]?.trim()
                    arr[count]["fax"] = address?.split("Fax:")[1]?.split("\n")[0]?.trim()

                    count++
                }
            })

            resolve(arr)
        } catch (error) {
            console.error(error.message)
        }
    })
}