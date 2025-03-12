import useSWR from "swr";

export function useUser() {
  const fetcher = async (url) => {
    const token = sessionStorage.getItem("accessToken");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(res);

    if (!res.ok) {
      const error = new Error("Error in fetching data");
      throw error;
    }

    return res.json();
  };

  const { data, error, isLoading } = useSWR(
    "https://takeawaytracker.mealzo.co.uk/account/user/",
    // "https://marketing.mealzo.co.uk/account/user/",

    fetcher
  );

  console.log("data from SWR in useUser:", data);

  return {
    user: data,
    isLoading,
    error,
  };
}
