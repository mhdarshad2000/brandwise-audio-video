const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/peavey/peavey-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const peavey = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    peavey[i] = {}
                    peavey[i]['state'] = ($(state).children("strong").text())
                    peavey[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        peavey[i]['states'][j] = {}
                        peavey[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        peavey[i]['states'][j]['link'] = link

                        peavey[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(peavey)
                    fs.writeFileSync("./peavey/peavey.json", brand)
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

            $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                if($(serviceCenter).children("div").length === 0){
                    arr[i] = {}
                    const serviceCenterName = $(serviceCenter).text().split("\n")[0]
                    arr[i]["serviceCenter"] = serviceCenterName 
                    arr[i]["address"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("(")[0].replaceAll("\n","").replaceAll("\t","").trim()
                    arr[i]["phone"] = $(serviceCenter).text()?.split("(")[1]?.split("\n")[0]?"("+$(serviceCenter).text()?.split("(")[1]?.split("\n")[0]:""
                }else{
                    $(serviceCenter).children("div").each((j,service)=>{
                        arr[j]={}
                    const serviceCenterName = $(service).text().split("\n")[0]
                        arr[j]["serviceCenter"] = serviceCenterName 
                    arr[j]["address"] = $(service).text().replace(serviceCenterName,"")?.split("(")[0].replaceAll("\n","").replaceAll("\t","").trim()
                    arr[j]["phone"] = $(service).text()?.split("(")[1]?.split("\n")[0]?"("+$(service).text()?.split("(")[1]?.split("\n")[0]:""
                    })
                }
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}