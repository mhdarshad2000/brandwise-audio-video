const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/sigma/sigma-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const sigma = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                sigma[i] = {}
                sigma[i]['state'] = ($(state).children("strong").text())
                sigma[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    sigma[i]['states'][j] = {}
                    sigma[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    sigma[i]['states'][j]['link'] = link

                    sigma[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(sigma)
                fs.writeFileSync("./sigma/sigma.json", brand)

            }, 20000)

        } catch (error) {
            console.log(error.message)
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

            $(postDiv).children("div").children("strong").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).text().trim()
                arr[i]["address"] = $(serviceCenter).parent().next().text().replace(/(\r\n|\n|\r|\t)/gm, "  ").replaceAll("         "," ").trim()
                arr[i]["phone"] =$(serviceCenter)?.parent()?.next()?.next()?.text()?.split("/")[0]?.trim()
            })
            if(!arr.length){
                $(postDiv).children("div").children("a").each((i,serviceCenter)=>{
                    arr[i]={}
                    arr[i]["serviceCenter"] = $(serviceCenter).text()
                    arr[i]["address"] = $(serviceCenter).parent().next().text().replace(/(\r\n|\n|\r|\t)/gm, "  ").replaceAll("         "," ").trim()
                    arr[i]["phone"] = $(serviceCenter).parent().next().next().text().trim()
                })
            }            
           
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}