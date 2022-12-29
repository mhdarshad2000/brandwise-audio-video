const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")
const { gzip } = require("zlib")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/panasonic/panasonic-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const panasonic = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                panasonic[i] = {}
                panasonic[i]['state'] = ($(state).children("strong").text())
                panasonic[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        panasonic[i]['states'][j] = {}
                        panasonic[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        panasonic[i]['states'][j]['link'] = link
                        panasonic[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                            const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            panasonic[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(panasonic)
                fs.writeFileSync("./panasonic/panasonic.json", brand)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/panasonic")
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

                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1]={}
                        let address = []
                        let phone = []
                        $(serviceCenter).children("td").each((j,td)=>{
                            if(j===0){
                                arr[i-1]["serviceCenter"] = $(td).text()
                            }else if(/[a-z]/gi.test($(td).text())){
                                address.push($(td).text())
                            }else if(!/[a-z]/gi.test($(td).text()) && $(td).text().length > 9 ){
                                phone.push($(td).text())
                            }
                        })
                        arr[i-1]["address"] = address.join("    ")
                        arr[i-1]["phone"] = phone.join("")
                    }
                })

            resolve(arr)
        } catch (error) {
            console.error(error.message)
        }
    })
}