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

    const data = {
        "probNum": probNum,
        "prompt": prompt,
        "code": solution,
        "mode": mode
    }

   
      const res = await fetch("/api/ai", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const dataReturned = await res.json();
      const resField = document.getElementById("aiResponse")
      const html = "<span><p>" + marked.parse(dataReturned.message) + "</p></spam>"
      resField.innerHTML += html
      console.log(dataReturned)
  });