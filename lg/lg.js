const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lg/lg-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lg = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                lg[i] = {}
                lg[i]['state'] = ($(state).children("strong").text())
                lg[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        lg[i]['states'][j] = {}
                        lg[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lg[i]['states'][j]['link'] = link
                        lg[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        // const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        // const result = await nextPage(link)
                        // result.map((elem, index) => {
                        //     lg[i]['states'][j + index] = elem
                        // })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(lg)
                fs.writeFileSync("./lg/lg.json", brand)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/lg")
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

            const tableDiv = $(postDiv).find("table > tbody > tr")

            if ($(tableDiv).text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    if((i+1)%2 ===0 ){
                        arr[(i+1)/2-1]["address"] = $(serviceCenter).text().split("Address")[1].split(" Phone")[0].replaceAll("\n","").replaceAll("\t","").trim()
                        arr[(i+1)/2-1]["phone"] = $(serviceCenter).text().split("Phone")[1].replaceAll("\n","").replaceAll("\t","").trim()
                    }else{
                        arr[i/2]={}
                        arr[i/2]["serviceCenter"] = $(serviceCenter).text().replaceAll("\n","").replaceAll("\t","").trim()
                    }
                })
            }
            else {
                let count = 0
                $(postDiv).children("p").each((i, serviceCenter) => {
                    if ($(serviceCenter).children("strong.nomenegozio").length === 1 &&
                        !$(serviceCenter).children("strong").text().includes("LG Customer Service Representative") &&
                        !$(serviceCenter).children("strong").text().includes("View Map") &&
                        $(serviceCenter).children("strong").text().trim().length
                    ) {
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
            }


            resolve(arr)
        } catch (error) {
            console.error(error.message)
        }
    })
}