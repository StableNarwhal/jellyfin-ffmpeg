(async function () {
    const license = `Running this script for an extended period of time could lead to an IP ban. Do not manually refresh pages on www.amd.com in addition to running this script.\n\nYou are running the script at your own risk, the author is not affiliated with AMD in any way. This script has not been approved for use by anyone.\n\nThe MIT License\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
    if (!confirm(license)) {
        throw new Error('license');
    const pageTitle = document.querySelector('.page-title');
    let logEl = null;
    const rebrand = () => {
        const logoEl = document.querySelector('.site-logo img');
      if (logoEl) {
            logoEl.src = 'https://i.imgur.com/QvOPHDo.png'
            logoEl.insertAdjacentHTML('afterend', '<p style="color: white">Fix your caching!</p>')
        };
    }

    const createLogWindow = () => {
        const logSibling = document.querySelector('main');

        if (logSibling) {
            logEl = document.createElement('textarea');
            logEl.style.width = '800px';
            logEl.style.height = '150px';
            logSibling.insertAdjacentElement('beforebegin', logEl)
        }
    }

    const log = msg => {
        console.log(`log: ${msg}`);

        if (logEl) {
            logEl.value = msg + '\n' + logEl.value;
        }
    };

    const setTitle = msg => {
        if (pageTitle) {
            pageTitle.innerHTML = msg;
        }
    };

    const findPid = () => {
        log('looking for product id...');
        const urlMatch = location.href.match(/^https:\/\/www.amd.com\/.{2}\/direct-buy\/(\d{10})/);

        if (urlMatch == null || urlMatch.length !== 2) {
            const err = 'You must run this script from a product details page on www.AMD.com.\nThe script will add that product to your cart and take you to checkout.';
            alert(err);
            throw new Error(err);
        }

        const pid = urlMatch[1]
        log(`found product ID ${pid}`);
        return pid;
    }

    const addToCart = async (pid) => {
        log('adding to cart...');

        const result = await fetch(`https://www.amd.com/en/direct-buy/add-to-cart/${pid}?_wrapper_format=drupal_ajax`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            "referrer": document.location.href,
            "body": "js=true&_drupal_ajax=1&ajax_page_state%5Btheme%5D=amd&ajax_page_state%5Btheme_token%5D=&ajax_page_state%5Blibraries%5D=amd%2Famd-scripts%2Camd%2Fglobal-styling%2Camd_core%2Fforms%2Camd_shop_product%2Fdirect-buy%2Camd_shop_product%2Fdirect-buy-analytics%2Camd_shop_product%2Fdirect-buy-show-specs%2Camd_shop_product%2Fdirect-buy.pdp%2Camd_shop_product%2Fdirect-buy.url-manager%2Camd_shop_product%2Fset-cart-token%2Camd_shop_product%2Fshopping-cart-actions%2Cchosen%2Fdrupal.chosen%2Cchosen_lib%2Fchosen.css%2Ccore%2Fhtml5shiv%2Csystem%2Fbase",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        console.info(result);

        if (result.status === 403) {
            throw new Error('ban');
        } else if (result.redirected) {
            throw new Error(`add-to-cart redirected to ${result.url}`)
        } else if (result.status !== 200) {
            throw new Error(`add-to-cart status ${result.status}, type ${result.type}`);
        }
        const body = await result.text();
        console.info(body);
        if (body.includes('You have no products in your cart.')) throw new Error('Cart is empty')
    const fetchCheckoutPath = async () => {
        log('fetching checkout URL...')

        const result = await fetch("https://www.amd.com/en/direct-buy/shopping-cart/modal?_wrapper_format=drupal_modal", {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            "referrer": document.location.href,
            "body": "js=true&_drupal_ajax=1&ajax_page_state%5Btheme%5D=amd&ajax_page_state%5Btheme_token%5D=&ajax_page_state%5Blibraries%5D=amd%2Famd-scripts%2Camd%2Fglobal-styling%2Camd_core%2Fforms%2Camd_shop_product%2Fdirect-buy%2Camd_shop_product%2Fdirect-buy-analytics%2Camd_shop_product%2Fdirect-buy-show-specs%2Camd_shop_product%2Fdirect-buy.pdp%2Camd_shop_product%2Fdirect-buy.url-manager%2Camd_shop_product%2Fset-cart-token%2Camd_shop_product%2Fshopping-cart-actions%2Cchosen%2Fdrupal.chosen%2Cchosen_lib%2Fchosen.css%2Ccore%2Fhtml5shiv%2Csystem%2Fbase",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        console.info(result);

        if (result.status === 403) {
            throw new Error('ban');
        } else if (result.redirected) {
            throw new Error(`fetch-checkout-url redirected to ${result.url}`)
        } else if (result.status !== 200) {
            throw new Error(`fetch-checkout-url status ${result.status}, type ${result.type}`);
        }

        const body = await result.text();
        console.info(body);

        const checkoutUrls = body.match(/\/.{2}\\\/direct-buy\\\/checkout\\\/payment\\\/\d*\\\/.{2}/);

        if (checkoutUrls == null || checkoutUrls.length === 0) throw new Error('checkout URL not found')
        return checkoutUrls[0].replace(/\\/g, '');
    };

    const goToCheckout = (path) => {
        log('redirecting to checkout...')
        window.location = path;
    }

    const pid = findPid();

    rebrand();
    createLogWindow();
    setTitle(`
        The script will repeatedly try to add this product to your cart, then it will redirect you to checkout.<br/>
        If you see an error 503 after it redirects, keep refreshing the page.<br>
        If you see an error 403 - Access Denied, clear your browser cookies & cache, then try again.<br>
        Do not manually refresh pages on www.amd.com in addition to running this script.<br>
    `);

    let attempt = 0;
    while (true) {
        try {
            log(`---- Attempt ${++attempt} ----`);
            await addToCart(pid);
            const path = await fetchCheckoutPath();
            goToCheckout(path);
            break;
        } catch (e) {
            console.error(e);

            if (e.message === 'ban') {
                const err = 'Ban detected, clear your cookies & cache, then try again. Do not manually refresh pages on www.amd.com in addition to running this script.';
                log(err);
                alert(err);
                break;
            }

            log(`ERROR: ${e.message}`);
        }
    }
})(); 
