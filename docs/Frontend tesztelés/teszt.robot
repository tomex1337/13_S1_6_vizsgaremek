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

*** Variables ***
${URL}    https://corelytics.tomex.xyz
${email}    Somakoma@gmail.com
${password}    12345678
${name}    Somama

*** Test Cases ***
Regisztráció Teszt
    Open Browser    ${URL}    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Click Element    xpath=/html/body/div[2]/div/div[2]/div[2]/a
    Sleep    1s
    Input Text    xpath=//*[@id="name"]    text=${name}
    Input Text    xpath=//*[@id="email"]    text=${email}
    Input Text    xpath=//*[@id="password"]    text=${password}
    Input Text    xpath=//*[@id="confirmPassword"]    text=${password}
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Sleep   2s
    Element Text Should Be    xpath=/html/body/div[2]/div/div[1]/h2    Jelentkezz be a fiókodba
    Sleep  1s
    Close Browser

Regisztráció Tesz - Létező felhasználó
    Open Browser    ${URL}    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Click Element    xpath=/html/body/div[2]/div/div[2]/div[2]/a
    Sleep    1s
    Input Text    xpath=//*[@id="name"]    text=${name}
    Input Text    xpath=//*[@id="email"]    text=${email}
    Input Text    xpath=//*[@id="password"]    text=${password}
    Input Text    xpath=//*[@id="confirmPassword"]    text=${password}
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Page Should Contain Element    xpath=/html/body/div[2]/div/form/div[2]
    Sleep   1s
    Close Browser

Bejelentkezés Teszt
    Open Browser    ${URL}    firefox
    Click Element    xpath=/html/body/header/nav/div[4]/a
    Sleep    1s
    Input Text    xpath=//*[@id="email"]    text=${email}
    Input Text    xpath=//*[@id="password"]    text=${password}
    Click Element    xpath=/html/body/div[2]/div/form/div[2]/button
    Sleep    2s
    Element Text Should Be    xpath=/html/body/div[2]/div/div/h1    Profil kiegészítése
    Sleep  1s
    Close Browser

Profil Kiegészítése Teszt
    Open Browser    ${URL}    firefox
    Bejelentkezés    ${email}    ${password}
    Sleep    2s
    Input Text    xpath=//*[@id="birthDate"]    text=2000-01-01
    Select From List By Label    xpath=//*[@id="gender"]   Férfi
    Input Text    xpath=//*[@id="heightCm"]    text=180
    Input Text    xpath=//*[@id="weightKg"]    text=80
    Select From List By Label    xpath=//*[@id="activityLevelId"]    Nagyon aktív
    Select From List By Label    xpath=//*[@id="goalId"]    Fogyás
    Click Element    xpath=/html/body/div[2]/div/form/div[7]/button
    Sleep    2s
    Element Text Should Be    xpath=//*[@id="headlessui-menu-button-_r_e_"]    ${name}
    Sleep  1s
    Close Browser

Étel naplózás Teszt
    Open Browser    ${URL}    firefox
    Bejelentkezés    ${email}    ${password}
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

Felhasználó törlése Teszt
    Open Browser    ${URL}    firefox
    Bejelentkezés    ${email}    ${password}
    Sleep   2s
    Go To   https://corelytics.tomex.xyz/settings
    Sleep    2s
    Execute JavaScript    window.scrollTo(0, document.body.scrollHeight)
    Click Element    xpath=/html/body/div[2]/div/div[4]/button
    Sleep    1s
    Click Element    xpath=/html/body/div[2]/div/div[4]/div[2]/div/button[1]
    Sleep    3s
    Element Should Contain    xpath=/html/body/div[2]/div/div[1]/h2    Jelentkezz be a fiókodba
    Sleep  1s
    Close Browser