#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    // Fast input/output: always include these two lines.
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<ll> a(n);
    for (auto &x : a) cin >> x;

    ll sum = 0;
    for (ll x : a) sum += x;

    cout << sum << '\n';  // use '\n', not endl (endl is slow)
    return 0;
}
