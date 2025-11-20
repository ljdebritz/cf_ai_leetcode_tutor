const form = document.getElementById("formInfo")

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const probNum = document.getElementById("probNum").value;
    const prompt = document.getElementById("thought").value;
    const solution = document.getElementById("solution").value;
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    
    if (!probNum || !prompt || !solution || !mode) {
        alert("Please fill out all fields before submitting.");
        return;
    }
    const loader = "<p>LeetCoach is thinking...</p>"
    const resField = document.getElementById("aiResponse")
    resField.innerHTML = loader


    const data = {
        "probNum": probNum,
        "prompt": prompt,
        "code": solution,
        "mode": mode,
        "userID": checkCookie(),
    }

   
      const res = await fetch("/api/ai", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const dataReturned = await res.json();
      const html = "<span><p>" + marked.parse(dataReturned.message) + "</p><spam>"
      resField.innerHTML = html
      console.log(dataReturned)
  });

  function checkCookie() {
    const userCookie = "userID=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArr = decodedCookie.split(";")
    for (const cook of cookieArr) {
      const trimmedCook = cook.trim();
      if (trimmedCook.startsWith(userCookie)){
        const cookSplit = trimmedCook.split('=');
        return cookSplit[1];
      }
    }
    return createCookie();
  }


  function createCookie(){
    yearInSecs = 60 * 60 * 24 * 365;
    const newId = crypto.randomUUID();
    document.cookie = `userID=${newId}; max-age=${yearInSecs}; path=/`;
    return newId;
  }