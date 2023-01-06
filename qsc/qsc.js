const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/qsc/qsc-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const qsc = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    qsc[i] = {}
                    qsc[i]['state'] = ($(state).children("strong").text())
                    qsc[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        qsc[i]['states'][j] = {}
                        qsc[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        qsc[i]['states'][j]['link'] = link

                        qsc[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(qsc)
                    fs.writeFileSync("./qsc/qsc.json", brand)
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

            const tableDiv = $(postDiv).find("table > tbody > tr > td > h2")

            if($(tableDiv).text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    arr [i] = {}
                    const serviceCenterName = $(serviceCenter).html()
                    arr[i]["serviceCenter"] = serviceCenterName?.replace("amp;","")
                    const string = $(serviceCenter).parent().html()

                    const temp = string.split(serviceCenterName)[1]?.split("<h2>")[0]?.replaceAll("</h2>","").replaceAll("<br>","").replaceAll("\t","").split("\n")
                    let phone =[]
                    temp.map((elem,index)=>{
                        if(!/[a-z]/gi.test(elem?.replaceAll("x100",""))){
                            phone.push(elem)
                            temp[index] = ""
                        }
                    })

                    arr[i]["address"] = temp.join().replaceAll(",","").trim()
                    arr[i]["phone"] = phone.join().replaceAll(",","")?.replace("x100","").trim()

                })
            }else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("Qsc Audio Service Centers in")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                        const temp = $(postDiv).html().split($(serviceCenter).html())[1]?.split("<h2>")[0]?.split("<p>&nbsp;</p>")[0]
                        const phone = temp.split("<br>")[0]
                        arr[i-1]["address"] = temp.split(phone)[1]?.replaceAll("\n","").replaceAll("\t","").replaceAll("<br>","     ").trim()
                        arr[i-1]["phone"] = phone.replaceAll("\n","").replaceAll("</h2>","").replaceAll("\t","").trim()
                    }
                })
            }
            
            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}