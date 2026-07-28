import {test, expect} from "../setup"


/* already done in the test object used from setup that extends playwrights test
test.beforeAll('get token',async()=>{
    const token = getBearerToken();
})
*/

/*
//if there is a URL path where can retrieve users
test("get users", async({api, apiBaseUrl}) =>{
    const response = await api.get('${apiBaseUrl}/users')
    expect(response.ok()).toBeTruthy()
    console.log(response)
})*/

//test retrieval of profile
test.describe('test profile retrieval', ()=>{
    
    test("gets user profile using bearer token auth", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/3`);
        const body = await response.json()

        expect (typeof body.ful)
        expect(response.ok()).toBeTruthy()
        expect(response.status()).toBe(200)
        expect(typeof body.full_name).toBe("string")
        expect(body.full_name.length).toBeGreaterThan(0) //name should not be null 
        expect (body.email.length).toBeGreaterThan(0)
        
    });
   /*
    test('update profile', async({api, apiBaseUrl})=>{
        const response = await api.patch('${apiBaseUrl/customer/3')

    })*/
//

})

