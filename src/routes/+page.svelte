<script lang="ts">
  import "../app.css";
  import axios from "axios";
  import SvelteMarkdown from "svelte-markdown";
  import { onMount } from "svelte";
  import html2canvas from "html2canvas";

  let backendUrl = "";

  let linkedinUrl: string = "";
  let language: string = "English";
  let roastingResult: string = "";
  let isLoading = false;

  let showAlert = true;
  let progress = 0;

  let profile: any | null = null;

  const languages = ["Bahasa Indonesia", "English"];

  async function getProfile() {
    isLoading = true;
    const url = `${backendUrl}/linkedin`;
    try {
      const response = await axios.post(url, {
        link: linkedinUrl,
        language: language,
      });
      const data = await response.data;
      
      await roastProfile(data.biodata);
    } catch (error: any) {
      isLoading = false;
      profile = null;
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404 || error.response?.status === 400) {
          roastingResult = "Profile not found";
        } else if (error.response?.status === 429) {
          roastingResult = "Too many request, please try again later";
        } else {
          roastingResult = error.response?.data.message;
        }
      } else {
        roastingResult = error.message;
      }

      console.error("Error get profile:", error);
    }
  }

  async function roastProfile(biodata: any) {
    isLoading = true;
    const url = `${backendUrl}/roasting`;
    try {
      const response = await axios.post(url, {
        biodata: biodata,
        language: language,
      });
      profile = biodata.profile;
      const data = await response.data;
      roastingResult = data.roasting;
    } catch (error: any) {
      profile = null;
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 504) {
          roastingResult = "Response timeout, please try again";
        } else if (error.response?.status === 429) {
          roastingResult = "Too many request, please try again later";
        } else {
          roastingResult = error.response?.data.message;
        }
      } else {
        roastingResult = error.message;
      }
      console.error("Error roasting Linkedin:", error);
    }
    isLoading = false;
  }

  function downloadResult() {
    const resultDiv = document.getElementById("result") as HTMLElement;
    html2canvas(resultDiv).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "result.png";
      link.click();
    });
  }

  onMount(() => {
    let interval = setInterval(() => {
      progress += 1;
      if (progress >= 105) {
        clearInterval(interval);
        showAlert = false;
      }
    }, 100);
  });
</script>

<svelte:head>
  <title>Linkedin Profile Roasting 🔥</title>
  <meta name="description" content="Roasting Your Linkedin Profile with AI" />
</svelte:head>

<main
  class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12"
>
  {#if showAlert}
    <div
      class="fixed top-0 left-0 w-full bg-white border border-black p-4 z-50 text-center"
    >
      <p class="mb-2">
        <span class="text-red-500">Warning</span>: This is a website for roast/mockery the given linkedin profile. All roast/mockery results are made using AI, please understand and do not be offended.
      </p>
      <div class="relative w-full h-1 bg-gray-200 overflow-hidden">
        <div
          class="absolute top-0 left-0 h-full bg-red-500"
          style="width: {progress}%; transition:all 0.5s ease-out;"
        ></div>
      </div>
    </div>
  {/if}
  <div class="relative py-3 sm:max-w-2xl sm:mx-auto">
    <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
      <h1 class="text-3xl font-bold mb-5 text-indigo-600">
        LinkedIn Profile Roasting 🔥
      </h1>

      <form on:submit|preventDefault={getProfile} class="mb-5">
        <div class="mb-4">
          <input
            bind:value={linkedinUrl}
            type="url"
            placeholder="https://www.linkedin.com/in/username/"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            required
          />
        </div>

        <div class="mb-4">
          <select
            bind:value={language}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {#each languages as lang}
              <option value={lang}>{lang}</option>
            {/each}
          </select>
        </div>

        <button
          type="submit"
          class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Roasting..." : "Submit"}
        </button>
      </form>

      {#if roastingResult != ""}
        <div class="my-6" id="result">
          {#if profile != null}
            <h2 class="text-xl font-semibold mb-3">Roasting Linkedin <u>{profile.name}</u></h2>
          {/if}
          <p class="text-gray-700 bg-gray-100 p-4 rounded-md mb-1" >
            <SvelteMarkdown source={roastingResult} />
          </p>
          <small>
            This is joke, don't take it seriously. Made with ❤️ by <b>RoastLinkedin</b>
          </small>
          <br>
          <br>
        </div>
        <div class="mt-6">
          <button
            class="w-full flex gap-1 justify-center items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            on:click={downloadResult}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="2em"
              height="2em"
              viewBox="0 0 512 512"
              ><path
                fill="currentColor"
                d="M376 160H272v153.37l52.69-52.68a16 16 0 0 1 22.62 22.62l-80 80a16 16 0 0 1-22.62 0l-80-80a16 16 0 0 1 22.62-22.62L240 313.37V160H136a56.06 56.06 0 0 0-56 56v208a56.06 56.06 0 0 0 56 56h240a56.06 56.06 0 0 0 56-56V216a56.06 56.06 0 0 0-56-56M272 48a16 16 0 0 0-32 0v112h32Z"
              /></svg
            >
            <span>Download Result</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
  <div style="height: 100px;">
    </div>
  <div
        id="footer"
        class="fixed left-0 right-0 p-2 flex flex-col gap-2 text-center justify-center w-full bg-white bottom-0"
    >
        <div class="flex gap-2 justify-center">
            <a href="https://wallofdonations.my.id" class="underline"
            target="_blank">
            WallOfDonations
        </a>
            <a
                href="https://roastgithub.my.id"
                class="underline"
                target="_blank">RoastGithub</a
            >
            <a
                href="https://roastlinkedin.my.id"
                class="underline"
                target="_blank">RoastLinkedin</a
            >
            <a href="https://roastwaifu.my.id" class="underline" target="_blank"
                >RoastWaifu</a
            >
        </div>
        <div class="flex justify-center gap-2 items-center">
            <a href="https://trakteer.id/bagood" target="_blank"
                ><img
                    id="wse-buttons-preview"
                    src="https://cdn.trakteer.id/images/embed/trbtn-red-1.png?date=18-11-2023"
                    height="40"
                    style="border: 0px; height: 40px; --darkreader-inline-border-top: 0px; --darkreader-inline-border-right: 0px; --darkreader-inline-border-bottom: 0px; --darkreader-inline-border-left: 0px;"
                    alt="Trakteer Saya"
                    data-darkreader-inline-border-top=""
                    data-darkreader-inline-border-right=""
                    data-darkreader-inline-border-bottom=""
                    data-darkreader-inline-border-left=""
                /></a
            >
            <iframe
                src="https://ghbtns.com/github-btn.html?user=bagusindrayana&repo=roastlinkedin&type=star&count=true&size=large"
                frameborder="0"
                scrolling="0"
                width="170"
                height="30"
                title="GitHub"
            ></iframe>
        </div>
    </div>
</main>
