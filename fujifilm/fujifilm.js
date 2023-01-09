const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/fujifilm/fujifilm-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const fujifilm = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    fujifilm[i] = {}
                    fujifilm[i]['state'] = ($(state).children("strong").text())
                    fujifilm[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        fujifilm[i]['states'][j] = {}
                        fujifilm[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        fujifilm[i]['states'][j]['link'] = link

                        fujifilm[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(fujifilm)
                    fs.writeFileSync("./fujifilm/fujifilm.json", brand)
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

            let count = 0
            $(postDiv).children("p").each((i, serviceCenter) => {
                if ((/\d/).test($(serviceCenter)) &&
                    !$(serviceCenter).text().includes("Fujifilm Support Products") &&
                    !$(serviceCenter).text().includes("Fujifilm Contact Customer Service") &&
                    !$(serviceCenter).text().includes("Zip") &&
                    $(serviceCenter).text().length
                ) {
                    const temp = $(serviceCenter).html().replace(/(\r\n|\n|\r|\t|&nbsp;)/gm, "").split("<br><br>")
                    temp.map((elem, index) => {
                        arr[count] = {}
                        let phone = []
                        let fax
                        elem = elem.split("<br>")
                        elem.map((element, j) => {
                            if (j == 0) {
                                arr[count]["serviceCenter"] = element.replaceAll("<strong>", "").replaceAll("</strong>", "").trim()
                                elem[j] = ""
                            } else if (element.includes("Map")) {
                                elem[j] = ""
                            } else if (element.includes("Fax")) {
                                fax = element
                                elem[j] = ""
                            } else if (element.includes("Phone:")) {
                                phone.push(element)
                                elem[j] = ""
                            } else if (!/[a-z]/gi.test(element)) {
                                phone.push(element)
                                elem[j] = ""
                            } else if (element.includes(" or ")) {
                                phone.push(element)
                                elem[j] = ""
                            } else if(element.includes("or ")){
                                phone.push(element)
                                elem[j] = ""
                            } else if(element.includes("ext. 101")){
                                phone.push(element)
                                elem[j] = ""
                            }
                        })
                        arr[count]["address"] = elem.join("").trim()
                        arr[count]["phone"] = phone.join("").split("or")[0].replaceAll("Phone:", "")?.split("ext.")[0]?.trim()
                        arr[count]["fax"] = fax?.replaceAll("Fax:", "").trim()
                        count++
                    })
                }
            })
            if (!arr.length) {
                let i = 0
                const h3Div = $(postDiv).children("h3").html()
                const temp = $(postDiv).html().split(h3Div)[1].split("<p>")[0].replace(/(\r\n|\n|\r|\t|&nbsp;)/gm, "").replace("</h3>","").trim().split("<br><br>")
                temp.map((elem, index) => {
                    arr[i] = {}
                    let phone = []
                    let fax
                    elem = elem.split("<br>")
                    elem.map((element, j) => {
                        if (j == 0) {
                            arr[i]["serviceCenter"] = element.replaceAll("<strong>", "").replaceAll("</strong>", "").trim()
                            elem[j] = ""
                        } else if (element.includes("Map")) {
                            elem[j] = ""
                        } else if (element.includes("Fax")) {
                            fax = element
                            elem[j] = ""
                        } else if (element.includes("Phone:")) {
                            phone.push(element)
                            elem[j] = ""
                        } else if (!/[a-z]/gi.test(element)) {
                            phone.push(element)
                            elem[j] = ""
                        } else if (element.includes(" or ")) {
                            phone.push(element)
                            elem[j] = ""
                        }
                    })
                    arr[i]["address"] = elem.join("").trim()
                    arr[i]["phone"] = phone.join("").split("or")[0].replaceAll("Phone:", "").trim()
                    arr[i]["fax"] = fax?.replaceAll("Fax:", "").trim()
                    i++
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}