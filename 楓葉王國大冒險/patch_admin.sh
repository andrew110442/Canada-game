#!/bin/bash
awk '
/const \[redemptions/ {
  print "  const [teamRedemptions, setTeamRedemptions] = useState<any[]>([]);"
  print "  const [itemRedemptions, setItemRedemptions] = useState<any[]>([]);"
  next
}
/const fetchRedemptions = async \(\) => {/,/  };/ {
  if ($0 ~ /const fetchRedemptions = async \(\) => {/) {
    print "  const fetchRedemptions = async () => {"
    print "    try {"
    print "      const res = await fetch(`${window.location.origin}/api/redemptions`);"
    print "      if (res.ok) {"
    print "        const data = await res.json();"
    print "        if (Array.isArray(data)) {"
    print "          setTeamRedemptions(data);"
    print "          setItemRedemptions([]);"
    print "        } else {"
    print "          setTeamRedemptions(data.teamRedemptions || []);"
    print "          setItemRedemptions(data.itemRedemptions || []);"
    print "        }"
    print "      }"
    print "    } catch (err) {"
    print "      console.warn(\"Failed to load redemptions:\", err);"
    print "    }"
    print "  };"
    in_func = 1
  } else if (in_func && $0 ~ /  };/) {
    in_func = 0
  } else if (in_func) {
    # Skip lines inside old function
  } else {
    print
  }
  next
}
/<span>兌換紀錄/ {
  print "            <span>兌換紀錄 ({teamRedemptions.length + itemRedemptions.length})</span>"
  next
}
{ print }
' src/components/AdminPanel.tsx > src/components/AdminPanel.tsx.tmp && mv src/components/AdminPanel.tsx.tmp src/components/AdminPanel.tsx
