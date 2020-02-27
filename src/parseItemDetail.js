const Apify = require('apify');

const { log } = Apify.utils;

async function parseItemDetail($, request, requestQueue) {
    const { sellerUrl, asin, detailUrl } = request.userData;
    const item = {};
    const reviewsConunt = $('#acrCustomerReviewText').length !== 0 ? $('#acrCustomerReviewText').eq(0).text() : null;
    const stars = $('.reviewCountTextLinkedHistogram').length !== 0 ? $('.reviewCountTextLinkedHistogram').attr('title').match(/(\d+\.\d+)|\d+/)[0] : null;
    const details = {};
    $('table.prodDetTable tr').each(function () {
        details[$(this).find('th').text().trim()] = $(this).find('td').text().trim();
    });
    item.featureDesc = $('#featurebullets_feature_div').length !== 0 ? $('#featurebullets_feature_div').text().trim() : null;
    item.desc = $('#productDescription').length !== 0 ? $('#productDescription').text().trim() : null;
    item.reviewsCount = reviewsConunt;
    item.stars = stars;
    item.details = details;
    item.images = [];
    if ($('script:contains("ImageBlockATF")').length !== 0) {
        const scriptText = $('script:contains("ImageBlockATF")').text();
        if (scriptText.indexOf("'colorImages':").length !== 0 && scriptText.indexOf("'colorToAsin'").length !== 0 && scriptText.indexOf("{ 'initial': ").length !== 0) {
            const parsedImageArray = JSON.parse(scriptText.split("'colorImages':")[1].split("'colorToAsin'")[0].trim().replace("{ 'initial': ", '').replace(/}\,$/, ''));
            for (const image of parsedImageArray) {
                if (image.hiRes && image.hiRes !== null) {
                    item.images.push(image.hiRes);
                } else if (image.large && image.large !== null) {
                    item.images.push(image.large);
                } else {
                    log.info(`Bad image, report to github, please (debug info item url: ${request.url})`);
                }
            }
        }
    }


    await requestQueue.addRequest({
        url: sellerUrl,
        userData: {
            asin,
            detailUrl,
            sellerUrl,
            itemDetail: item,
            label: 'seller',
        },
    });
}

module.exports = parseItemDetail;
