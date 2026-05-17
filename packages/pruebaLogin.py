from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

try:
    driver.get("http://localhost:5173/login")
    driver.maximize_window()

    time.sleep(2)

    email_input = driver.find_element(By.XPATH, "//input[@placeholder='tu.email@institucion.edu']")
    password_input = driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")

    email_input.send_keys("heidi@uta.edu.ec")
    password_input.send_keys("12345678")

    button = driver.find_element(By.XPATH, "//button[contains(text(),'Iniciar sesión')]")
    button.click()

    time.sleep(3)

    driver.get("http://localhost:5173/forgot-password")
    driver.maximize_window()

    time.sleep(3)

    email_input = driver.find_element(
        By.XPATH,
        "//input[@type='email' or contains(@placeholder,'email')]"
    )

    email_input.send_keys("heidi@uta.edu.ec")

    button = driver.find_element(
        By.XPATH,
        "//button[contains(text(),'Recuperar') or contains(text(),'Enviar enlace')]"
    )

    button.click()

    time.sleep(3)

    print("Test recuperar contraseña ejecutado correctamente")
    print("Login test ejecutado")

finally:
    driver.quit()