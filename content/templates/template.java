import java.io.*;
import java.util.*;

// Save as Main.java: judges compile and run the class named Main.
public class Main {

    // ---- Fast input ---------------------------------------------------------
    // Scanner is very slow for large inputs. BufferedReader reads big chunks
    // at once, and StringTokenizer splits each line into tokens quickly.
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer tokens = new StringTokenizer("");

    // Next whitespace-separated token, reading new lines as needed, so it
    // doesn't matter how the input is split across lines.
    static String next() throws IOException {
        while (!tokens.hasMoreTokens()) tokens = new StringTokenizer(in.readLine());
        return tokens.nextToken();
    }

    static int nextInt() throws IOException {
        return Integer.parseInt(next());
    }

    public static void main(String[] args) throws IOException {
        // ---- Fast output ----------------------------------------------------
        // System.out.println writes out every line immediately, which is slow.
        // PrintWriter collects the output and writes it in big pieces.
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));

        // ---- Read -----------------------------------------------------------
        int n = nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = nextInt();

        // ---- Solve ----------------------------------------------------------
        // Rule of thumb: about 10^8 simple operations per second.
        // Sorting an int[] with Arrays.sort can be slow on purpose-built
        // tests; sort an Integer[] or a List<Integer> instead if you get
        // Time Limit Exceeded.

        // ---- Write ----------------------------------------------------------
        for (int x : a) {
            out.print(x);
            out.print(' ');
        }
        out.println();

        out.flush(); // Important: nothing is printed until you flush.
    }
}
