const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/pioneer/pioneer-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const pioneer = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    pioneer[i] = {}
                    pioneer[i]['state'] = ($(state).children("strong").text())
                    pioneer[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        pioneer[i]['states'][j] = {}
                        pioneer[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        pioneer[i]['states'][j]['link'] = link

                        pioneer[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(pioneer)
                    fs.writeFileSync("./pioneer/pioneer.json", brand)
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

            const tableDiv = $(postDiv).find("table > tbody > tr")

            if($(tableDiv).text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    arr [i] = {}
                    const serviceCenterName = $(serviceCenter).children("td").first().children("strong").text()
                    arr[i]["serviceCenter"] = serviceCenterName 
                    arr[i]["address"] = $(serviceCenter).children("td").first().text().replace(serviceCenterName,"").split("(")[0].replaceAll("\n","").replaceAll("         "," ").replace("-","").replaceAll("\t","").trim()
                    arr[i]["phone"] = $(serviceCenter).children("td").first().text()?.split("(")[1] ? "("+ $(serviceCenter).children("td").first().text()?.split("(")[1]?.split("\n")[0]?.trim() :""
                })
            }else{
                $(postDiv).children("p.elenchi").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).find("span > strong").text().includes("Support for Pioneer products")){
                        arr[i] ={}
                        arr[i]["serviceCenter"] = $(serviceCenter).find("span > strong").text()
                        arr[i]["address"] = $(serviceCenter).find("span > span").text()
                        arr[i]["phone"] = $(serviceCenter).find("span[itemprop='telephone']").text()
                    }
                })
            }
            
            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}