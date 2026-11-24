#include <bits/stdc++.h>  // every standard library header in one line (GCC, used by Kattis/Codeforces)
using namespace std;

int main() {
    // ---- Fast input/output ------------------------------------------------
    // 1. sync_with_stdio(false): stop cin/cout from syncing with C's
    //    scanf/printf on every operation.
    // 2. cin.tie(nullptr): stop cin from flushing cout before every read.
    // Together they make cin/cout as fast as scanf/printf. Without them,
    // reading 10^6 numbers can be slow enough to get Time Limit Exceeded.
    // After these lines, don't mix cin/cout with scanf/printf.
    // (On a Mac with Apple's compiler, cin stays slower even with these
    // lines. Judges use GCC, where it's fast, so time your code there.)
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // ---- Read ---------------------------------------------------------------
    // >> skips spaces and newlines, so it doesn't matter how the input is
    // split across lines.
    int n;
    cin >> n;
    vector<int> a(n);
    for (int &x : a) cin >> x;

    // ---- Solve --------------------------------------------------------------
    // Rule of thumb: about 10^8 simple operations per second.
    //   n <= 10^5 → O(n log n) is fine, O(n^2) is too slow.
    //   n <= 5000 → O(n^2) is fine.

    // ---- Write --------------------------------------------------------------
    // Use '\n', not endl. endl also flushes the output, which is slow when
    // you print many lines.
    for (int x : a) cout << x << ' ';
    cout << '\n';
    return 0;
}
