import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

test.beforeEach(async({page})=>{await mockMessenger(page)});
async function loginBuyer(page){
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
}

test('guest Explore login restores original search route',async({page})=>{
 await page.goto('/explore/?q=branding');
 const login=page.locator('.hx-header .hx-login');
 await expect(login).toHaveAttribute('href',/next=.*explore/);
 await login.click();
 await loginBuyer(page);
 await expect(page).toHaveURL(/\/explore\/\?q=branding$/);
 await expect(page.locator('.hx-header .global-account-trigger')).toBeVisible();
});

test('guest project request login restores the brief, budget and timeline',async({page})=>{
 const query=new URLSearchParams({
  q:'Need help building a brand identity for our company',
  budget:'500,000 ₮',
  timeline:'2 долоо хоног',
 });
 await page.goto('/project-requests/?'+query);
 await page.getByRole('main').getByRole('link',{name:/Нэвтрэх|Sign in/}).click();
 await loginBuyer(page);
 await expect(page).toHaveURL(/\/project-requests\/?\?q=/);
 await expect(page.locator('.project-request-form textarea')).toHaveValue(/Need help building a brand identity/);
 await expect(page.getByRole('textbox',{name:/Төсвийн дээд хэмжээ/})).toHaveValue('500,000');
 await expect(page.getByRole('spinbutton',{name:/Хүсэж буй хугацаа/})).toHaveValue('14');
});

test('project draft survives route navigation and can be cleared',async({page})=>{
 await page.goto('/buyer/');
 await loginBuyer(page);
 // Wait for the actual Supabase session and dashboard to finish before navigating.
 await expect(page.locator('.workspace-main')).toBeVisible();
 await page.goto('/project-requests/');
 await expect(page.locator('.project-request-form')).toBeVisible();
 const title=page.locator('.project-request-form input').first();
 const description=page.locator('.project-request-form textarea');
 await title.fill('New menu photography project');
 await description.fill('We need a complete photography package and improved photo selection for our restaurant.');
 await expect(page.locator('.project-draft-status')).toBeVisible();
 await page.goto('/explore/');
 await page.goto('/project-requests/');
 await expect(title).toHaveValue('New menu photography project');
 await expect(description).toHaveValue(/complete photography package/);
 await page.getByRole('button',{name:/Арилгах|Clear draft/}).click();
 await expect(title).toHaveValue('');
 await expect(description).toHaveValue('');
 await page.reload();
 await expect(title).toHaveValue('');
});

test('hostile return destination is ignored after login',async({page})=>{
 await page.goto('/login/?mode=buyer&next=https%3A%2F%2Fevil.example');
 await loginBuyer(page);
 await expect(page).toHaveURL(/\/buyer\//);
 await expect(page.locator('.workspace-main')).toBeVisible();
});
