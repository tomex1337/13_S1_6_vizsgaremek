*** Settings ***
Library    SeleniumLibrary

*** Keywords ***
Bejelentkezés
    [Arguments]    ${email}    ${password}
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Sleep    1s
    Input Text    xpath=//*[@id="email"]    text=${email}
    Input Text    xpath=//*[@id="password"]    text=${password}
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button

Kiegészítés
    [Arguments]    ${birthDate}    ${gender}    ${height}    ${weight}    ${activityLevel}    ${goal}
    Sleep    2s
    Input Text    xpath=//*[@id="birthDate"]    text=${birthDate}
    Select From List By Label    xpath=//*[@id="gender"]   ${gender}
    Input Text    xpath=//*[@id="heightCm"]    text=${height}
    Input Text    xpath=//*[@id="weightKg"]    text=${weight}
    Select From List By Label    xpath=//*[@id="activityLevelId"]    ${activityLevel}
    Select From List By Label    xpath=//*[@id="goalId"]    ${goal}
    Click Element    xpath=/html/body/div[2]/div/form/div[7]/button
    Sleep    2s

*** Test Cases ***
Regisztráció Teszt
    Open Browser    https://corelytics.tomex.xyz    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Click Element    xpath=/html/body/div[2]/div/div[2]/div[2]/a
    Sleep    1s
    Input Text    xpath=//*[@id="name"]    text=Teszt Elek
    Input Text    xpath=//*[@id="email"]    text=TesztElek@gmail.com
    Input Text    xpath=//*[@id="password"]    text=12345678
    Input Text    xpath=//*[@id="confirmPassword"]    text=12345678
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Sleep   2s
    Element Text Should Be    xpath=/html/body/div[2]/div/div[1]/h2    Jelentkezz be a fiókodba
    Sleep  1s
    Close Browser

Regisztráció Tesz - Létező felhasználó
    Open Browser    https://corelytics.tomex.xyz    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Click Element    xpath=/html/body/div[2]/div/div[2]/div[2]/a
    Sleep    1s
    Input Text    xpath=//*[@id="name"]    text=Teszt Elek
    Input Text    xpath=//*[@id="email"]    text=TesztElek@gmail.com
    Input Text    xpath=//*[@id="password"]    text=12345678
    Input Text    xpath=//*[@id="confirmPassword"]    text=12345678
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Page Should Contain Element    xpath=/html/body/div[2]/div/form/div[2]
    Sleep   1s
    Close Browser

Bejelentkezés Teszt
    Open Browser    https://corelytics.tomex.xyz    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Sleep    1s
    Input Text    xpath=//*[@id="email"]    text=TesztElek@gmail.com
    Input Text    xpath=//*[@id="password"]    text=12345678
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Sleep    2s
    Element Text Should Be    xpath=/html/body/div[2]/div/div/h1    Profil kiegészítése
    Sleep  1s
    Close Browser

Profil Kiegészítése Teszt
    Open Browser    https://corelytics.tomex.xyz    firefox
    Bejelentkezés    TesztElek@gmail.com    12345678
    Sleep    2s
    Input Text    xpath=//*[@id="birthDate"]    text=2000-01-01
    Select From List By Label    xpath=//*[@id="gender"]   Férfi
    Input Text    xpath=//*[@id="heightCm"]    text=180
    Input Text    xpath=//*[@id="weightKg"]    text=80
    Select From List By Label    xpath=//*[@id="activityLevelId"]    Nagyon aktív
    Select From List By Label    xpath=//*[@id="goalId"]    Fogyás
    Click Element    xpath=/html/body/div[2]/div/form/div[7]/button
    Sleep    2s
    Element Text Should Be    xpath=//*[@id="headlessui-menu-button-_r_e_"]    Teszt Elek
    Sleep  1s
    Close Browser

Étel naplózás Teszt
    Open Browser    https://corelytics.tomex.xyz    firefox
    Bejelentkezés    TesztElek@gmail.com    12345678
    Sleep    2s
    Go To    https://corelytics.tomex.xyz/food/log
    Sleep    2s
    Click Element    xpath=/html/body/div[2]/div[1]/div/div/div[2]/button
    Sleep    1s
    Click Element    xpath=/html/body/div[2]/div[3]/div/div[2]/div/button[1]
    Sleep    1s
    Input Text    xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]/input    text=Banán
    Sleep    1s
    Click Element    xpath=/html/body/div[2]/div[3]/div/div[2]/div[2]/div/button
    Sleep    1s
    Click Element    xpath=/html/body/div[2]/div[3]/div/div[2]/div[2]/button[2]
    Sleep    1s
    Element Should Contain    xpath=/html/body/div[2]/div[2]/div[2]/div[1]/div[2]/div/div/div[1]/div/div/p[1]    Banán
    Close Browser