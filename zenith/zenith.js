const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/zenith-electronics/zenith-electronics-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const zenith = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                zenith[i] = {}
                zenith[i]['state'] = ($(state).children("strong").text())
                zenith[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    zenith[i]['states'][j] = {}
                    zenith[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    zenith[i]['states'][j]['link'] = link

                    zenith[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(zenith)
                fs.writeFileSync("./zenith/zenith-electronics.json", brand)

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

            $(postDiv).find(" table > tbody > tr").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("td").find("h2").text()
                let address = []
                let phone = []
                $(serviceCenter).find("div").each((j,temp)=>{
                    if(/[a-z]/gi.test($(temp).text())){
                        address.push($(temp).text())
                    }else{
                        phone.push($(temp).text())
                    }
                })
                arr[i]["address"] = address.join("").replace(/(\r\n|\n|\r|\t)/gm, "").replaceAll("          "," ").trim()
                arr[i]["phone"] = phone.join("").trim()
            })
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}