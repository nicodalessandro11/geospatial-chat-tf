"""
Test script for LangChain improvements

Tests the new caching, pre-compiled queries, and validation features.

Author: Nicolas Dalessandro
Date: 2025-06-11
Version: 1.0.0
"""

import asyncio
import time
import requests
import json
from typing import List, Dict, Any

# Configuration
API_BASE_URL = "https://web-production-b7778.up.railway.app"
# API_BASE_URL = "http://localhost:8000"  # Use for local testing

class LangChainTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.test_results = []
    
    def test_health(self) -> Dict[str, Any]:
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=30)
            return {
                "test": "health_check",
                "status": "passed" if response.status_code == 200 else "failed",
                "response_time": response.elapsed.total_seconds(),
                "data": response.json() if response.status_code == 200 else None
            }
        except Exception as e:
            return {
                "test": "health_check",
                "status": "failed",
                "error": str(e)
            }
    
    def test_precompiled_queries(self) -> List[Dict[str, Any]]:
        """Test pre-compiled queries for speed"""
        precompiled_questions = [
            "¿Cuál es la población de Barcelona?",
            "población de barcelona",
            "cuántos distritos tiene barcelona",
            "how many districts in barcelona"
        ]
        
        results = []
        for question in precompiled_questions:
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.base_url}/ask",
                    json={"question": question},
                    timeout=60
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        "test": "precompiled_query",
                        "question": question,
                        "status": "passed",
                        "response_time": end_time - start_time,
                        "execution_time": data.get("execution_time"),
                        "cached": data.get("cached", False),
                        "answer_length": len(data.get("answer", "")),
                        "has_validation_warnings": bool(data.get("validation_warnings"))
                    })
                else:
                    results.append({
                        "test": "precompiled_query",
                        "question": question,
                        "status": "failed",
                        "error": f"HTTP {response.status_code}"
                    })
            
            except Exception as e:
                results.append({
                    "test": "precompiled_query",
                    "question": question,
                    "status": "failed",
                    "error": str(e)
                })
        
        return results
    
    def test_cache_functionality(self) -> List[Dict[str, Any]]:
        """Test caching by asking the same question twice"""
        test_question = "¿Cuántos distritos tiene Barcelona?"
        results = []
        
        # First request (should not be cached)
        try:
            start_time = time.time()
            response1 = requests.post(
                f"{self.base_url}/ask",
                json={"question": test_question},
                timeout=60
            )
            end_time = time.time()
            
            if response1.status_code == 200:
                data1 = response1.json()
                results.append({
                    "test": "cache_first_request",
                    "status": "passed",
                    "response_time": end_time - start_time,
                    "cached": data1.get("cached", False),
                    "execution_time": data1.get("execution_time")
                })
                
                # Second request (should be cached)
                time.sleep(1)  # Small delay
                
                start_time = time.time()
                response2 = requests.post(
                    f"{self.base_url}/ask",
                    json={"question": test_question},
                    timeout=60
                )
                end_time = time.time()
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    results.append({
                        "test": "cache_second_request",
                        "status": "passed",
                        "response_time": end_time - start_time,
                        "cached": data2.get("cached", False),
                        "execution_time": data2.get("execution_time"),
                        "cache_speedup": f"{data1.get('execution_time', 0) / max(data2.get('execution_time', 0.1), 0.1):.1f}x"
                    })
        
        except Exception as e:
            results.append({
                "test": "cache_functionality",
                "status": "failed",
                "error": str(e)
            })
        
        return results
    
    def test_complex_queries(self) -> List[Dict[str, Any]]:
        """Test complex queries that require LangChain agent"""
        complex_questions = [
            "¿Cuál es la población de Eixample?",
            "¿Cuántas escuelas hay en Gràcia?",
            "Compara la población de Sarrià-Sant Gervasi y Nou Barris"
        ]
        
        results = []
        for question in complex_questions:
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.base_url}/ask",
                    json={"question": question},
                    timeout=120  # Longer timeout for complex queries
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        "test": "complex_query",
                        "question": question,
                        "status": "passed",
                        "response_time": end_time - start_time,
                        "execution_time": data.get("execution_time"),
                        "success": data.get("success", False),
                        "answer_length": len(data.get("answer", "")),
                        "has_validation_warnings": bool(data.get("validation_warnings"))
                    })
                else:
                    results.append({
                        "test": "complex_query",
                        "question": question,
                        "status": "failed",
                        "error": f"HTTP {response.status_code}"
                    })
            
            except Exception as e:
                results.append({
                    "test": "complex_query",
                    "question": question,
                    "status": "failed",
                    "error": str(e)
                })
        
        return results
    
    def test_cache_stats(self) -> Dict[str, Any]:
        """Test cache statistics endpoint"""
        try:
            response = requests.get(f"{self.base_url}/cache/stats", timeout=30)
            if response.status_code == 200:
                return {
                    "test": "cache_stats",
                    "status": "passed",
                    "data": response.json()
                }
            else:
                return {
                    "test": "cache_stats",
                    "status": "failed",
                    "error": f"HTTP {response.status_code}"
                }
        except Exception as e:
            return {
                "test": "cache_stats",
                "status": "failed",
                "error": str(e)
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and generate a comprehensive report"""
        print("🚀 Starting LangChain improvement tests...")
        
        # Test 1: Health check
        print("\n1. Testing health endpoint...")
        health_result = self.test_health()
        self.test_results.append(health_result)
        print(f"   Status: {health_result['status']}")
        
        if health_result['status'] != 'passed':
            print("❌ Health check failed. Stopping tests.")
            return self.generate_report()
        
        # Test 2: Pre-compiled queries
        print("\n2. Testing pre-compiled queries...")
        precompiled_results = self.test_precompiled_queries()
        self.test_results.extend(precompiled_results)
        for result in precompiled_results:
            print(f"   {result['question']}: {result['status']} ({result.get('response_time', 0):.2f}s)")
        
        # Test 3: Cache functionality
        print("\n3. Testing cache functionality...")
        cache_results = self.test_cache_functionality()
        self.test_results.extend(cache_results)
        for result in cache_results:
            print(f"   {result['test']}: {result['status']} (cached: {result.get('cached', False)})")
        
        # Test 4: Complex queries
        print("\n4. Testing complex queries...")
        complex_results = self.test_complex_queries()
        self.test_results.extend(complex_results)
        for result in complex_results:
            print(f"   {result['question']}: {result['status']} ({result.get('response_time', 0):.2f}s)")
        
        # Test 5: Cache stats
        print("\n5. Testing cache statistics...")
        stats_result = self.test_cache_stats()
        self.test_results.append(stats_result)
        print(f"   Status: {stats_result['status']}")
        if stats_result['status'] == 'passed':
            print(f"   Cache entries: {stats_result['data']['cache_stats']['valid_entries']}")
        
        return self.generate_report()
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['status'] == 'passed')
        
        # Calculate average response times
        response_times = [
            result.get('response_time', 0) 
            for result in self.test_results 
            if 'response_time' in result and result['status'] == 'passed'
        ]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Find cached vs non-cached performance
        cached_times = [
            result.get('execution_time', 0)
            for result in self.test_results
            if result.get('cached') is True
        ]
        non_cached_times = [
            result.get('execution_time', 0)
            for result in self.test_results
            if result.get('cached') is False and 'execution_time' in result
        ]
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "success_rate": f"{(passed_tests / total_tests * 100):.1f}%" if total_tests > 0 else "0%",
                "avg_response_time": f"{avg_response_time:.2f}s"
            },
            "performance": {
                "avg_cached_time": f"{sum(cached_times) / len(cached_times):.2f}s" if cached_times else "N/A",
                "avg_non_cached_time": f"{sum(non_cached_times) / len(non_cached_times):.2f}s" if non_cached_times else "N/A",
                "cache_speedup": f"{(sum(non_cached_times) / len(non_cached_times)) / (sum(cached_times) / len(cached_times)):.1f}x" if cached_times and non_cached_times else "N/A"
            },
            "detailed_results": self.test_results
        }
        
        return report


def main():
    """Main test function"""
    tester = LangChainTester(API_BASE_URL)
    report = tester.run_all_tests()
    
    print("\n" + "="*60)
    print("📊 FINAL REPORT")
    print("="*60)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']}")
    print(f"Average Response Time: {report['summary']['avg_response_time']}")
    print(f"Cache Speedup: {report['performance']['cache_speedup']}")
    
    # Save detailed report
    with open("test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to test_report.json")
    
    return report


if __name__ == "__main__":
    main() 