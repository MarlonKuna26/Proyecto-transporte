from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.maximize_window()

wait = WebDriverWait(driver, 10)

try:
    driver.get("http://localhost:5173/register")

    input_name = wait.until(
        EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Juan Pérez']"))
    )
    input_email = driver.find_element(By.XPATH, "//input[@placeholder='tu.email@uta.edu.ec']")
    input_password = driver.find_element(By.XPATH, "//input[@placeholder='Mínimo 8 caracteres']")
    password_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")

    btn_crear = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Crear cuenta')]"))
    )

    input_name.send_keys("Heidi Villavicencio")
    input_email.send_keys("heidi@uta.edu.ec")
    input_password.send_keys("Test1234")
    password_inputs[1].send_keys("Test1234")

    time.sleep(4)

    driver.execute_script("arguments[0].scrollIntoView(true);", btn_crear)
    driver.execute_script("arguments[0].click();", btn_crear)

    input_code = wait.until(
        EC.presence_of_element_located((By.XPATH, "//input[@placeholder='000000']"))
    )

    btn_verificar = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Verificar email')]"))
    )

    input_code.send_keys("123456")

    driver.execute_script("arguments[0].click();", btn_verificar)

   
    time.sleep(8)

finally:
    driver.quit()