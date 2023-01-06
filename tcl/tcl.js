const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/tcl/tcl-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const tcl = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                tcl[i] = {}
                tcl[i]['state'] = ($(state).children("strong").text())
                tcl[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    tcl[i]['states'][j] = {}
                    tcl[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    tcl[i]['states'][j]['link'] = link

                    tcl[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(tcl)
                fs.writeFileSync("./tcl/tcl.json", brand)

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

            $(postDiv).find("table > tbody > tr").each((i,serviceCenter)=>{
                if(i!== 0){
                    arr[i-1]= {}
                    let address = []
                    let phone = []
                    $(serviceCenter).children("td").each((j,table)=>{
                        if(j==0){
                            arr[i-1]["serviceCenter"] = $(table).text().replace(/(\r\n|\n|\r|\t)/gm, "").trim()
                        }else if(/[a-z]/gi.test($(table).text())){
                            address.push($(table).text())
                        }else{
                            phone.push($(table).text())
                        }
                        arr[i-1]["address"] = address.join("")
                        arr[i-1]["phone"] = phone.join("")
                    })
                }
            })
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}