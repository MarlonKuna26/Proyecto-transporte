from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time

driver = webdriver.Chrome()
# Esta es la ruta local del proyecto en ejecución
driver.get("http://localhost:5173/login")
time.sleep(1)

# emailInput = driver.find_element(By.XPATH, "//input[@type='email']")
# emailInput.send_keys("jfiallos7065@uta.edu.ec")
# time.sleep(1)

# passwordInput = driver.find_element(By.XPATH, "//input[@type='password']")
# passwordInput.send_keys("Marlon182004@")
# time.sleep(1)

# btnIniciarSesion = driver.find_element(By.XPATH, "//button[@type='submit']")
# btnIniciarSesion.click()
# time.sleep(1)


#Registrarse

btnRegister= driver.find_element(By.LINK_TEXT,"Regístrate aquí") 
btnRegister.click()

nameInput= driver.find_element(By.XPATH,"//input[@type='text']")
nameInput.send_keys("Marlon Steven Guevara Panimboza")
time.sleep(4)
emailInput= driver.find_element(By.XPATH, "//input[@type='email']")
emailInput.send_keys("mguevara4350@uta.edu.ec")
passwordInput=driver.find_element(By.XPATH,"//input[@type='password']")
passwordInput.send_keys("Marlon182004@")
againPass=driver.find_element(By.XPATH,"//input[@placeholder='Repite tu contraseña']")
againPass.send_keys("Marlon182004@")

btnRegister= driver.find_element(By.XPATH,"//button[text()='Crear cuenta']")
btnRegister.click()
time.sleep(100)

