const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/vivitar/vivitar-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const vivitar = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                vivitar[i] = {}
                vivitar[i]['state'] = ($(state).children("strong").text())
                vivitar[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    vivitar[i]['states'][j] = {}
                    vivitar[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    vivitar[i]['states'][j]['link'] = link

                    vivitar[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(vivitar)
                fs.writeFileSync("./vivitar/vivitar.json", brand)

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

            const tableDiv = $(postDiv).find("table > tbody > tr ")

            if($(tableDiv).text()){
                $(tableDiv).each((i,serviceCenter)=>{
                arr[i]= {}
                arr[i]["serviceCenter"] = $(serviceCenter).find("h2").text()
                let phone = []
                let address = []
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
            }else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("Vivitar Service Centers in")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                        arr[i-1]["address"] = $(serviceCenter).next().text().replace(/(\r\n|\n|\r|\t)/gm, "").replaceAll("          "," ").trim()
                        arr[i-1]["phone"] = $(serviceCenter).next().next().text().trim()
                    }
                })
            }
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}