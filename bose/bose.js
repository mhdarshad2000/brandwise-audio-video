const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/bose/bose-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const bose = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                bose[i] = {}
                bose[i]['state'] = ($(state).children("strong").text())
                bose[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        bose[i]['states'][j] = {}
                        bose[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        bose[i]['states'][j]['link'] = link
                        bose[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        //     const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        // const result = await nextPage(link)
                        // result.map((elem, index) => {
                        //     bose[i]['states'][j + index] = elem
                        // })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(bose)
                fs.writeFileSync("./bose/bose.json", brand)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/bose")
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

            const tableDiv = $(postDiv).find(" table > tbody > tr")

            if ($(tableDiv).text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    if (i !== 0 && /[a-z]/gi.test($(serviceCenter).children("td").first().text())) {
                        arr[i - 1] = {}
                        arr[i - 1]["serviceCenter"] = $(serviceCenter).children("td").first().text()
                        const address = $(serviceCenter).children("td:nth-child(2)").text().replaceAll("    ", "").split("\n")
                        let phone = []
                        address.map((elem, index) => {
                            if (!/[a-z]/gi.test(elem) && elem.length > 10) {
                                phone.push(elem)
                                address[index] = ""
                            }
                        })
                        arr[i - 1]["address"] = address.join("    ").trim()
                        arr[i - 1]["phone"] = phone.join().trim()
                    }
                })
            } else {
                $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                    arr[i] = {}
                    if ($(serviceCenter).find("strong").text()) {
                        const serviceCenterName = $(serviceCenter).find("strong")
                        arr[i]["serviceCenter"] = serviceCenterName.text()
                        const address = $(serviceCenterName).parent().text().replace($(serviceCenterName).text(), "").split("Store hours:")[0].split("\n")
                        let phone = []
                        address.map((elem, index) => {
                            if (!/[a-z]/gi.test(elem)) {
                                phone.push(elem)
                                address[index] = ""
                            }
                        })
                        arr[i]["address"] = address.join().replaceAll("\t", "").replaceAll(",", "").trim()
                        arr[i]["phone"] = phone.join().replaceAll("\t", "").replaceAll(",", "").trim()
                    } else if ($(serviceCenter).children("p").text()) {
                        const string = $(serviceCenter).children("p").text().split(" Store hours:")[0].split("\n")
                        arr[i]["serviceCenter"] = string[0].trim()
                        let phone = []
                        string.map((element, index) => {
                            if (index === 0) {
                                string[index] = ""
                            } else if (!/[a-z]/gi.test(element)) {
                                phone.push(element)
                                string[index] = ""
                            }
                        })
                        arr[i]["address"] = string.join().replaceAll("\t", "").replaceAll(",", "").replaceAll("       ", " ").trim()
                        arr[i]["phone"] = phone.join().replaceAll("\t", "").replaceAll(",", "").trim()
                    } else {
                        const string = $(serviceCenter).text().split("Store hours:")[0].split("\n")
                        arr[i]["serviceCenter"] = string[0].trim()
                        let phone = []
                        string.map((element, index) => {
                            if (index === 0) {
                                string[index] = ""
                            } else if (!/[a-z]/gi.test(element)) {
                                phone.push(element)
                                string[index] = ""
                            }
                        })
                        arr[i]["address"] = string.join().replaceAll("\t", "").replaceAll(",", "").replaceAll("       ", " ").trim()
                        arr[i]["phone"] = phone.join().replaceAll("\t", "").replaceAll(",", "").trim()
                    }
                })
            }
            
            if(!arr.length){
                let count = 0
                $(postDiv).children("p").each((i,serviceCenter)=>{
                    if($(serviceCenter).text().includes("Store hours:")){
                        arr[count]={}
                        const string = $(serviceCenter).text().split("Store hours:")[0].split("\n")
                        arr[count]["serviceCenter"] = string[0].trim()
                        let phone = []
                        string.map((element, index) => {
                            if (index === 0) {
                                string[index] = ""
                            } else if (!/[a-z]/gi.test(element)) {
                                phone.push(element)
                                string[index] = ""
                            }
                        })
                        arr[count]["address"] = string.join().replaceAll("\t", "").replaceAll(",", "").replaceAll("       ", " ").trim()
                        arr[count]["phone"] = phone.join().replaceAll("\t", "").replaceAll(",", "").trim()
                        count ++
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            console.error(error.message)
        }
    })
}