const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/pentax/pentax-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const pentax = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    pentax[i] = {}
                    pentax[i]['state'] = ($(state).children("strong").text())
                    pentax[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        pentax[i]['states'][j] = {}
                        pentax[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        pentax[i]['states'][j]['link'] = link

                        pentax[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(pentax)
                    fs.writeFileSync("./pentax/pentax.json", brand)
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

            const list = $(postDiv).find("ul")
            if ($(list).text()) {
                $(list).each((i, serviceCenter) => {
                    arr[i] = {}
                    let address = []
                    let phone = []
                    $(serviceCenter).children("li").each((j, service) => {
                        if (j === 0) {
                            arr[i]["serviceCenter"] = $(service).text().replaceAll("\n", "").replaceAll("\t").trim()
                        } else if (/[a-z]/gi.test($(service).text())) {
                            address.push($(service).text())
                        } else {
                            phone.push($(service).text())
                        }
                    })
                    arr[i]["address"] = address.join("  ")
                    arr[i]["phone"] = phone.join()
                })
            } else {
                let count = 0
                $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                    if ($(serviceCenter).text().length) {
                        if ($(serviceCenter).children("div").length) {
                            $(serviceCenter).children("div").each((j, service) => {
                                arr[j] = {}
                                const string = $(service).html().split("<br>")
                                let address = []
                                let phone = []
                                arr[j]["serviceCenter"] = string
                                string.map((elem,index)=>{
                                    if(index === 1){
                                        arr[j]["serviceCenter"] = elem.replaceAll("amp;","")
                                    }else if(/[a-z]/gi.test(elem)){
                                        address.push(elem)
                                    }else{
                                        phone.push(elem)
                                    }
                                })
                                arr[j]["address"] = address.join("  ").trim()
                                arr[j]["phone"] = phone.join().replaceAll(",","").replaceAll("\n","").replaceAll("\t","").trim()
                            })
                            } else {
                                arr[count] = {}
                                
                                // The using of .text() is a worst case so, took .html() and edited it as needed.
                                // According to the certain scenarios the if and else used to get the data correctly

                                const string = $(serviceCenter).html().split("<br>")
                                let address = []
                                let phone = []
                                string.map((elem, index) => {
                                    if (elem.includes("<li>")) {
                                        const lsitText = elem.split("\n")
                                        lsitText.map((element, j) => {
                                            if (j === 0) {
                                                arr[count]["serviceCenter"] = element.replace("amp;", "")
                                            } else {
                                                const temp = element.replace("<li>", "").replace("</li>", "")
                                                if (/[a-z]/gi.test(temp)) {
                                                    address.push(temp.replaceAll("  ", ""))
                                                } else {
                                                    phone.push(temp)
                                                }
                                            }
                                        })
                                    } else if (index === 1) {
                                        arr[count]["serviceCenter"] = elem
                                    } else if (index > 1 && /[a-z]/gi.test(elem)) {
                                        address.push(elem)
                                    } else {
                                        phone.push(elem)
                                    }
                                })

                                arr[count]["address"] = address.join("  ")
                                arr[count]["phone"] = phone.join().replaceAll(",", "").replaceAll("\n", "").replaceAll("\t", "").trim()
                                count++
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