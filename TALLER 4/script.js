function calcular(){

    let num1 = Number(document.getElementById("num1").value);
    let num2 = Number(document.getElementById("num2").value);

    let texto = "";

    for(let i = 1; i <= 5; i++){

        if(i == 1){
            texto += "Suma: " + (num1 + num2) + "<br>";
        }

        else if(i == 2){
            texto += "Resta: " + (num1 - num2) + "<br>";
        }

        else if(i == 3){
            texto += "Multiplicación: " + (num1 * num2) + "<br>";
        }

        else if(i == 4){
            texto += "División: " + (num1 / num2) + "<br>";
        }

        else if(i == 5){
            texto += "Módulo: " + (num1 % num2) + "<br>";
        }

    }

    document.getElementById("resultado").innerHTML = texto;
}